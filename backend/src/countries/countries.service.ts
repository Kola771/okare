import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

/**
 * Service CRUD pour la table "countries".
 *
 * - Toutes les fonctions utilisent un try/catch.
 * - Les erreurs SQL ne sont jamais exposées à l'utilisateur (uniquement loggées côté serveur).
 * - Deux variantes de requêtes : PostgreSQL ($1, $2…, guillemets doubles) et MySQL (?, backticks).
 * - Le type de BDD est détecté automatiquement via DataSource.options.type.
 */
@Injectable()
export class CountriesService {
  private readonly logger = new Logger(CountriesService.name);
  private readonly isPostgres: boolean;

  constructor(private readonly ds: DataSource) {
    this.isPostgres = ds.options.type === 'postgres';
  }

  /** Retourne tous les pays triés par nom (A → Z). */
  async findAll() {
    try {
      const q = this.isPostgres
        ? `SELECT "id", "code", "name", "currency", "timezone", "phoneRegex", "isActive" FROM "countries" ORDER BY "name" ASC`
        : 'SELECT `id`, `code`, `name`, `currency`, `timezone`, `phoneRegex`, `isActive` FROM `countries` ORDER BY `name` ASC';

      return await this.ds.query(q);
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des pays', error);
      throw new InternalServerErrorException('Impossible de récupérer la liste des pays.');
    }
  }

  /** Retourne un pays par son UUID. Lève NotFoundException si introuvable. */
  async findOne(id: string) {
    try {
      const q = this.isPostgres
        ? `SELECT "id", "code", "name", "currency", "timezone", "phoneRegex", "isActive" FROM "countries" WHERE "id" = $1`
        : 'SELECT `id`, `code`, `name`, `currency`, `timezone`, `phoneRegex`, `isActive` FROM `countries` WHERE `id` = ?';

      const rows = await this.ds.query(q, [id]);

      if (!rows.length) {
        throw new NotFoundException('Pays introuvable.');
      }

      return rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la récupération du pays ${id}`, error);
      throw new InternalServerErrorException('Impossible de récupérer ce pays.');
    }
  }

  /**
   * Crée un nouveau pays.
   * - Vérifie l'unicité du code pays avant insertion.
   * - PostgreSQL utilise RETURNING pour retourner la ligne insérée.
   * - MySQL génère un UUID puis fait un SELECT pour retourner la ligne.
   */
  async create(dto: CreateCountryDto) {
    try {
      await this.checkCodeUnique(dto.code);

      if (this.isPostgres) {
        const rows = await this.ds.query(
          `INSERT INTO "countries" ("code", "name", "currency", "timezone", "phoneRegex", "isActive")
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING "id", "code", "name", "currency", "timezone", "phoneRegex", "isActive"`,
          [
            dto.code.toUpperCase(),
            dto.name,
            dto.currency ?? 'XOF',
            dto.timezone ?? 'Africa/Porto-Novo',
            dto.phoneRegex,
            dto.isActive ?? false,
          ],
        );
        return rows[0];
      } else {
        const id = this.generateUuid();
        await this.ds.query(
          'INSERT INTO `countries` (`id`, `code`, `name`, `currency`, `timezone`, `phoneRegex`, `isActive`) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            id,
            dto.code.toUpperCase(),
            dto.name,
            dto.currency ?? 'XOF',
            dto.timezone ?? 'Africa/Porto-Novo',
            dto.phoneRegex,
            dto.isActive ? 1 : 0,
          ],
        );
        return this.findOne(id);
      }
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error('Erreur lors de la création du pays', error);
      throw new InternalServerErrorException('Impossible de créer ce pays.');
    }
  }

  /**
   * Met à jour un pays existant.
   * - Vérifie que le pays existe (sinon 404).
   * - Si le code est modifié, vérifie son unicité (en excluant le pays courant).
   * - Construit dynamiquement le SET avec seulement les champs fournis.
   */
  async update(id: string, dto: UpdateCountryDto) {
    try {
      await this.findOne(id);

      if (dto.code) {
        await this.checkCodeUnique(dto.code, id);
      }

      const fields: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      /** Ajoute un champ au SET uniquement s'il est présent dans le DTO. */
      const addField = (column: string, value: unknown) => {
        if (value !== undefined) {
          if (this.isPostgres) {
            fields.push(`"${column}" = $${paramIndex++}`);
          } else {
            fields.push(`\`${column}\` = ?`);
          }
          values.push(column === 'isActive' && !this.isPostgres ? (value ? 1 : 0) : value);
        }
      };

      addField('code', dto.code?.toUpperCase());
      addField('name', dto.name);
      addField('currency', dto.currency);
      addField('timezone', dto.timezone);
      addField('phoneRegex', dto.phoneRegex);
      addField('isActive', dto.isActive);

      if (!fields.length) {
        return this.findOne(id);
      }

      if (this.isPostgres) {
        values.push(id);
        await this.ds.query(
          `UPDATE "countries" SET ${fields.join(', ')} WHERE "id" = $${paramIndex}`,
          values,
        );
      } else {
        values.push(id);
        await this.ds.query(
          `UPDATE \`countries\` SET ${fields.join(', ')} WHERE \`id\` = ?`,
          values,
        );
      }

      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      this.logger.error(`Erreur lors de la modification du pays ${id}`, error);
      throw new InternalServerErrorException('Impossible de modifier ce pays.');
    }
  }

  /** Supprime un pays par son UUID. Vérifie qu'il existe avant suppression. */
  async remove(id: string) {
    try {
      await this.findOne(id);

      const q = this.isPostgres
        ? `DELETE FROM "countries" WHERE "id" = $1`
        : 'DELETE FROM `countries` WHERE `id` = ?';

      await this.ds.query(q, [id]);

      return { message: 'Pays supprimé avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la suppression du pays ${id}`, error);
      throw new InternalServerErrorException('Impossible de supprimer ce pays.');
    }
  }

  /** Vérifie qu'aucun autre pays n'utilise ce code (unicité). Lève ConflictException sinon. */
  private async checkCodeUnique(code: string, excludeId?: string) {
    const upperCode = code.toUpperCase();

    let rows: unknown[];

    if (this.isPostgres) {
      rows = excludeId
        ? await this.ds.query(`SELECT "id" FROM "countries" WHERE "code" = $1 AND "id" != $2`, [upperCode, excludeId])
        : await this.ds.query(`SELECT "id" FROM "countries" WHERE "code" = $1`, [upperCode]);
    } else {
      rows = excludeId
        ? await this.ds.query('SELECT `id` FROM `countries` WHERE `code` = ? AND `id` != ?', [upperCode, excludeId])
        : await this.ds.query('SELECT `id` FROM `countries` WHERE `code` = ?', [upperCode]);
    }

    if ((rows as unknown[]).length > 0) {
      throw new ConflictException('Un pays avec ce code existe déjà.');
    }
  }

  /** Génère un UUID v4 (pour MySQL qui n'a pas gen_random_uuid()). */
  private generateUuid(): string {
    const hex = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${(8 + Math.floor(Math.random() * 4)).toString(16)}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  }
}
