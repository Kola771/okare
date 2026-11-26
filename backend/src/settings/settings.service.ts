import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '@/entities/setting.entity';
import { UpsertSettingDto } from './dto/upsert-setting.dto';

/**
 * Service CRUD pour la table "settings" (paramètres globaux).
 *
 * - Table clé-valeur : la clé est la PK, la valeur est du JSONB.
 * - Utilise le repository TypeORM → fonctionne sur PostgreSQL et MySQL.
 * - Toutes les fonctions utilisent un try/catch.
 * - Les erreurs SQL ne sont jamais exposées à l'utilisateur.
 * - Le champ updatedById est renseigné automatiquement lors des modifications.
 */
@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(Setting)
    private readonly repo: Repository<Setting>,
  ) {}

  /** Retourne tous les paramètres triés par clé. */
  async findAll(): Promise<Setting[]> {
    try {
      return await this.repo.find({ order: { key: 'ASC' } });
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des paramètres', error);
      throw new InternalServerErrorException('Impossible de récupérer les paramètres.');
    }
  }

  /** Retourne un paramètre par sa clé. */
  async findOne(key: string): Promise<Setting> {
    try {
      const setting = await this.repo.findOne({ where: { key } });

      if (!setting) {
        throw new NotFoundException('Paramètre introuvable.');
      }

      return setting;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la récupération du paramètre "${key}"`, error);
      throw new InternalServerErrorException('Impossible de récupérer ce paramètre.');
    }
  }

  /**
   * Crée ou met à jour un paramètre (upsert).
   * - Si la clé existe, met à jour la valeur.
   * - Sinon, crée une nouvelle entrée.
   * - Enregistre l'ID de l'admin qui a modifié.
   */
  async upsert(dto: UpsertSettingDto, userId: string): Promise<Setting> {
    try {
      let setting = await this.repo.findOne({ where: { key: dto.key } });

      if (setting) {
        setting.value = dto.value;
        setting.updatedById = userId;
      } else {
        setting = this.repo.create({
          key: dto.key,
          value: dto.value,
          updatedById: userId,
        });
      }

      return await this.repo.save(setting);
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour du paramètre "${dto.key}"`, error);
      throw new InternalServerErrorException('Impossible de sauvegarder ce paramètre.');
    }
  }

  /** Supprime un paramètre par sa clé. */
  async remove(key: string): Promise<{ message: string }> {
    try {
      const setting = await this.findOne(key);

      await this.repo.remove(setting);

      return { message: 'Paramètre supprimé avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la suppression du paramètre "${key}"`, error);
      throw new InternalServerErrorException('Impossible de supprimer ce paramètre.');
    }
  }
}
