import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ZoneCategory } from '@/entities/zone-category.entity';
import { CreateZoneCategoryDto } from './dto/create-zone-category.dto';
import { UpdateZoneCategoryDto } from './dto/update-zone-category.dto';

/**
 * Service CRUD pour la table "zone_categories".
 *
 * - Utilise le repository TypeORM → fonctionne sur PostgreSQL et MySQL.
 * - Toutes les fonctions utilisent un try/catch.
 * - Les erreurs SQL ne sont jamais exposées à l'utilisateur.
 */
@Injectable()
export class ZoneCategoriesService {
  private readonly logger = new Logger(ZoneCategoriesService.name);

  constructor(
    @InjectRepository(ZoneCategory)
    private readonly repo: Repository<ZoneCategory>,
  ) {}

  /** Retourne toutes les catégories de zones triées par label, avec la ville. */
  async findAll(): Promise<ZoneCategory[]> {
    try {
      return await this.repo.find({
        order: { label: 'ASC' },
        relations: ['city'],
      });
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des catégories de zones', error);
      throw new InternalServerErrorException('Impossible de récupérer les catégories de zones.');
    }
  }

  /** Retourne les catégories de zones d'une ville donnée. */
  async findByCity(cityId: string): Promise<ZoneCategory[]> {
    try {
      return await this.repo.find({
        where: { cityId },
        order: { label: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des catégories de la ville ${cityId}`, error);
      throw new InternalServerErrorException('Impossible de récupérer les catégories de cette ville.');
    }
  }

  /** Retourne une catégorie de zone par son UUID. */
  async findOne(id: string): Promise<ZoneCategory> {
    try {
      const category = await this.repo.findOne({
        where: { id },
        relations: ['city'],
      });

      if (!category) {
        throw new NotFoundException('Catégorie de zone introuvable.');
      }

      return category;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la récupération de la catégorie ${id}`, error);
      throw new InternalServerErrorException('Impossible de récupérer cette catégorie.');
    }
  }

  /**
   * Crée une nouvelle catégorie de zone.
   * - Vérifie l'unicité du couple (cityId, code).
   */
  async create(dto: CreateZoneCategoryDto): Promise<ZoneCategory> {
    try {
      await this.checkCodeUniqueInCity(dto.cityId, dto.code);

      const category = this.repo.create(dto);

      return await this.repo.save(category);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error('Erreur lors de la création de la catégorie de zone', error);
      throw new InternalServerErrorException('Impossible de créer cette catégorie.');
    }
  }

  /**
   * Met à jour une catégorie de zone existante.
   * - Si le code ou la ville change, vérifie l'unicité du couple (cityId, code).
   */
  async update(id: string, dto: UpdateZoneCategoryDto): Promise<ZoneCategory> {
    try {
      const category = await this.findOne(id);

      if (dto.code || dto.cityId) {
        const cityId = dto.cityId ?? category.cityId;
        const code = dto.code ?? category.code;
        await this.checkCodeUniqueInCity(cityId, code, id);
      }

      Object.assign(category, dto);

      return await this.repo.save(category);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      this.logger.error(`Erreur lors de la modification de la catégorie ${id}`, error);
      throw new InternalServerErrorException('Impossible de modifier cette catégorie.');
    }
  }

  /** Supprime une catégorie de zone par son UUID. */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const category = await this.findOne(id);

      await this.repo.remove(category);

      return { message: 'Catégorie de zone supprimée avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la suppression de la catégorie ${id}`, error);
      throw new InternalServerErrorException('Impossible de supprimer cette catégorie.');
    }
  }

  /** Vérifie qu'aucune autre catégorie n'utilise ce code dans cette ville. */
  private async checkCodeUniqueInCity(cityId: string, code: string, excludeId?: string): Promise<void> {
    const where: Record<string, unknown> = { cityId, code };
    if (excludeId) {
      where.id = Not(excludeId);
    }

    const existing = await this.repo.findOne({
      where,
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Une catégorie avec ce code existe déjà dans cette ville.');
    }
  }
}
