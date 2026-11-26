import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Country } from '@/entities/country.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

/**
 * Service CRUD pour la table "countries".
 *
 * - Utilise le repository TypeORM (pas de requêtes raw) → fonctionne sur PostgreSQL et MySQL.
 * - Toutes les fonctions utilisent un try/catch.
 * - Les erreurs SQL ne sont jamais exposées à l'utilisateur (uniquement loggées côté serveur).
 */
@Injectable()
export class CountriesService {
  private readonly logger = new Logger(CountriesService.name);

  constructor(
    @InjectRepository(Country)
    private readonly repo: Repository<Country>,
  ) {}

  /** Retourne tous les pays triés par nom (A → Z). */
  async findAll(): Promise<Country[]> {
    try {
      return await this.repo.find({ order: { name: 'ASC' } });
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des pays', error);
      throw new InternalServerErrorException('Impossible de récupérer la liste des pays.');
    }
  }

  /** Retourne un pays par son UUID. Lève NotFoundException si introuvable. */
  async findOne(id: string): Promise<Country> {
    try {
      const country = await this.repo.findOne({ where: { id } });

      if (!country) {
        throw new NotFoundException('Pays introuvable.');
      }

      return country;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la récupération du pays ${id}`, error);
      throw new InternalServerErrorException('Impossible de récupérer ce pays.');
    }
  }

  /**
   * Crée un nouveau pays.
   * - Vérifie l'unicité du code pays avant insertion.
   * - Le code est automatiquement mis en majuscule.
   */
  async create(dto: CreateCountryDto): Promise<Country> {
    try {
      await this.checkCodeUnique(dto.code);

      const country = this.repo.create({
        ...dto,
        code: dto.code.toUpperCase(),
      });

      return await this.repo.save(country);
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
   * - Applique uniquement les champs fournis dans le DTO.
   */
  async update(id: string, dto: UpdateCountryDto): Promise<Country> {
    try {
      const country = await this.findOne(id);

      if (dto.code) {
        await this.checkCodeUnique(dto.code, id);
        dto.code = dto.code.toUpperCase();
      }

      Object.assign(country, dto);

      return await this.repo.save(country);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      this.logger.error(`Erreur lors de la modification du pays ${id}`, error);
      throw new InternalServerErrorException('Impossible de modifier ce pays.');
    }
  }

  /** Supprime un pays par son UUID. Vérifie qu'il existe avant suppression. */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const country = await this.findOne(id);

      await this.repo.remove(country);

      return { message: 'Pays supprimé avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la suppression du pays ${id}`, error);
      throw new InternalServerErrorException('Impossible de supprimer ce pays.');
    }
  }

  /** Vérifie qu'aucun autre pays n'utilise ce code (unicité). Lève ConflictException sinon. */
  private async checkCodeUnique(code: string, excludeId?: string): Promise<void> {
    const upperCode = code.toUpperCase();

    const existing = await this.repo.findOne({
      where: excludeId
        ? { code: upperCode, id: Not(excludeId) }
        : { code: upperCode },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Un pays avec ce code existe déjà.');
    }
  }
}
