import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { DishCategory } from '@/entities/dish-category.entity';
import { CreateDishCategoryDto } from './dto/create-dish-category.dto';
import { UpdateDishCategoryDto } from './dto/update-dish-category.dto';

/**
 * Service CRUD pour la table "dish_categories" (catégories de plats).
 *
 * - Utilise le repository TypeORM → fonctionne sur PostgreSQL et MySQL.
 * - Toutes les fonctions utilisent un try/catch.
 * - Les erreurs SQL ne sont jamais exposées à l'utilisateur.
 */
@Injectable()
export class DishCategoriesService {
  private readonly logger = new Logger(DishCategoriesService.name);

  constructor(
    @InjectRepository(DishCategory)
    private readonly repo: Repository<DishCategory>,
  ) {}

  /** Retourne toutes les catégories de plats triées par sortOrder puis nom. */
  async findAll(): Promise<DishCategory[]> {
    try {
      return await this.repo.find({
        order: { sortOrder: 'ASC', name: 'ASC' },
      });
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des catégories de plats', error);
      throw new InternalServerErrorException('Impossible de récupérer les catégories de plats.');
    }
  }

  /** Retourne une catégorie de plat par son UUID. */
  async findOne(id: string): Promise<DishCategory> {
    try {
      const category = await this.repo.findOne({ where: { id } });

      if (!category) {
        throw new NotFoundException('Catégorie de plat introuvable.');
      }

      return category;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la récupération de la catégorie de plat ${id}`, error);
      throw new InternalServerErrorException('Impossible de récupérer cette catégorie.');
    }
  }

  /**
   * Crée une nouvelle catégorie de plat.
   * - Vérifie l'unicité du nom et du slug.
   */
  async create(dto: CreateDishCategoryDto): Promise<DishCategory> {
    try {
      await this.checkNameUnique(dto.name);
      await this.checkSlugUnique(dto.slug);

      const category = this.repo.create(dto);

      return await this.repo.save(category);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error('Erreur lors de la création de la catégorie de plat', error);
      throw new InternalServerErrorException('Impossible de créer cette catégorie.');
    }
  }

  /**
   * Met à jour une catégorie de plat existante.
   * - Si le nom ou le slug change, vérifie l'unicité.
   */
  async update(id: string, dto: UpdateDishCategoryDto): Promise<DishCategory> {
    try {
      const category = await this.findOne(id);

      if (dto.name) {
        await this.checkNameUnique(dto.name, id);
      }
      if (dto.slug) {
        await this.checkSlugUnique(dto.slug, id);
      }

      Object.assign(category, dto);

      return await this.repo.save(category);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      this.logger.error(`Erreur lors de la modification de la catégorie de plat ${id}`, error);
      throw new InternalServerErrorException('Impossible de modifier cette catégorie.');
    }
  }

  /** Supprime une catégorie de plat par son UUID. */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const category = await this.findOne(id);

      await this.repo.remove(category);

      return { message: 'Catégorie de plat supprimée avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la suppression de la catégorie de plat ${id}`, error);
      throw new InternalServerErrorException('Impossible de supprimer cette catégorie.');
    }
  }

  /** Vérifie qu'aucune autre catégorie n'utilise ce nom. */
  private async checkNameUnique(name: string, excludeId?: string): Promise<void> {
    const existing = await this.repo.findOne({
      where: excludeId ? { name, id: Not(excludeId) } : { name },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Une catégorie avec ce nom existe déjà.');
    }
  }

  /** Vérifie qu'aucune autre catégorie n'utilise ce slug. */
  private async checkSlugUnique(slug: string, excludeId?: string): Promise<void> {
    const existing = await this.repo.findOne({
      where: excludeId ? { slug, id: Not(excludeId) } : { slug },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Une catégorie avec ce slug existe déjà.');
    }
  }
}
