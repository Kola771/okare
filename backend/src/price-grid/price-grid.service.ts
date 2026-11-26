import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { PriceGrid } from '@/entities/price-grid.entity';
import { CreatePriceGridDto } from './dto/create-price-grid.dto';
import { UpdatePriceGridDto } from './dto/update-price-grid.dto';

/**
 * Service CRUD pour la table "price_grid" (grille tarifaire).
 *
 * - Utilise le repository TypeORM → fonctionne sur PostgreSQL et MySQL.
 * - Toutes les fonctions utilisent un try/catch.
 * - Les erreurs SQL ne sont jamais exposées à l'utilisateur.
 * - Le champ updatedById est renseigné automatiquement lors des modifications.
 */
@Injectable()
export class PriceGridService {
  private readonly logger = new Logger(PriceGridService.name);

  constructor(
    @InjectRepository(PriceGrid)
    private readonly repo: Repository<PriceGrid>,
  ) {}

  /** Retourne toute la grille tarifaire, avec la catégorie associée. */
  async findAll(): Promise<PriceGrid[]> {
    try {
      return await this.repo.find({
        order: { categoryId: 'ASC', posType: 'ASC' },
        relations: ['category'],
      });
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de la grille tarifaire', error);
      throw new InternalServerErrorException('Impossible de récupérer la grille tarifaire.');
    }
  }

  /** Retourne les prix d'une catégorie de zone donnée. */
  async findByCategory(categoryId: string): Promise<PriceGrid[]> {
    try {
      return await this.repo.find({
        where: { categoryId },
        order: { posType: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des prix de la catégorie ${categoryId}`, error);
      throw new InternalServerErrorException('Impossible de récupérer les prix de cette catégorie.');
    }
  }

  /** Retourne une entrée de la grille tarifaire par son UUID. */
  async findOne(id: string): Promise<PriceGrid> {
    try {
      const price = await this.repo.findOne({
        where: { id },
        relations: ['category'],
      });

      if (!price) {
        throw new NotFoundException('Entrée tarifaire introuvable.');
      }

      return price;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la récupération du tarif ${id}`, error);
      throw new InternalServerErrorException('Impossible de récupérer ce tarif.');
    }
  }

  /**
   * Crée une nouvelle entrée tarifaire.
   * - Vérifie l'unicité du couple (categoryId, posType).
   * - Le userId de l'admin est enregistré dans updatedById.
   */
  async create(dto: CreatePriceGridDto, userId: string): Promise<PriceGrid> {
    try {
      await this.checkUnique(dto.categoryId, dto.posType);

      const price = this.repo.create({
        ...dto,
        updatedById: userId,
      });

      return await this.repo.save(price);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error('Erreur lors de la création du tarif', error);
      throw new InternalServerErrorException('Impossible de créer ce tarif.');
    }
  }

  /**
   * Met à jour une entrée tarifaire.
   * - Si la catégorie ou le type de POS change, vérifie l'unicité du couple.
   * - Le userId de l'admin est enregistré dans updatedById.
   */
  async update(id: string, dto: UpdatePriceGridDto, userId: string): Promise<PriceGrid> {
    try {
      const price = await this.findOne(id);

      if (dto.categoryId || dto.posType) {
        const categoryId = dto.categoryId ?? price.categoryId;
        const posType = dto.posType ?? price.posType;
        await this.checkUnique(categoryId, posType, id);
      }

      Object.assign(price, dto);
      price.updatedById = userId;

      return await this.repo.save(price);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      this.logger.error(`Erreur lors de la modification du tarif ${id}`, error);
      throw new InternalServerErrorException('Impossible de modifier ce tarif.');
    }
  }

  /** Supprime une entrée tarifaire par son UUID. */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const price = await this.findOne(id);

      await this.repo.remove(price);

      return { message: 'Tarif supprimé avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la suppression du tarif ${id}`, error);
      throw new InternalServerErrorException('Impossible de supprimer ce tarif.');
    }
  }

  /** Vérifie qu'aucune autre entrée n'utilise ce couple (categoryId, posType). */
  private async checkUnique(categoryId: string, posType: string, excludeId?: string): Promise<void> {
    const where: Record<string, unknown> = { categoryId, posType };
    if (excludeId) {
      where.id = Not(excludeId);
    }

    const existing = await this.repo.findOne({
      where,
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Un tarif pour cette catégorie et ce type de POS existe déjà.');
    }
  }
}
