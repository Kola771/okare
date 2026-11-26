import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from '@/entities/vendor.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

/**
 * Service CRUD pour la table "vendors" (vendeurs).
 *
 * - Utilise le repository TypeORM → fonctionne sur PostgreSQL et MySQL.
 * - Toutes les fonctions utilisent un try/catch.
 * - Les erreurs SQL ne sont jamais exposées à l'utilisateur.
 * - Soft delete : les vendeurs ne sont jamais supprimés physiquement (deletedAt).
 * - Le champ createdById est renseigné lors de la création.
 */
@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);

  constructor(
    @InjectRepository(Vendor)
    private readonly repo: Repository<Vendor>,
  ) {}

  /** Retourne tous les vendeurs actifs (non supprimés) triés par nom. */
  async findAll(): Promise<Vendor[]> {
    try {
      return await this.repo.find({
        order: { displayName: 'ASC' },
        relations: ['user'],
      });
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des vendeurs', error);
      throw new InternalServerErrorException('Impossible de récupérer la liste des vendeurs.');
    }
  }

  /** Retourne un vendeur par son UUID. */
  async findOne(id: string): Promise<Vendor> {
    try {
      const vendor = await this.repo.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!vendor) {
        throw new NotFoundException('Vendeur introuvable.');
      }

      return vendor;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la récupération du vendeur ${id}`, error);
      throw new InternalServerErrorException('Impossible de récupérer ce vendeur.');
    }
  }

  /**
   * Crée un nouveau vendeur.
   * - Enregistre l'ID de l'utilisateur qui l'a créé dans createdById.
   */
  async create(dto: CreateVendorDto, userId: string): Promise<Vendor> {
    try {
      const vendor = this.repo.create({
        ...dto,
        createdById: userId,
      });

      return await this.repo.save(vendor);
    } catch (error) {
      this.logger.error('Erreur lors de la création du vendeur', error);
      throw new InternalServerErrorException('Impossible de créer ce vendeur.');
    }
  }

  /** Met à jour un vendeur existant. */
  async update(id: string, dto: UpdateVendorDto): Promise<Vendor> {
    try {
      const vendor = await this.findOne(id);

      Object.assign(vendor, dto);

      return await this.repo.save(vendor);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la modification du vendeur ${id}`, error);
      throw new InternalServerErrorException('Impossible de modifier ce vendeur.');
    }
  }

  /** Soft-delete un vendeur (renseigne deletedAt sans supprimer physiquement). */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const vendor = await this.findOne(id);

      await this.repo.softRemove(vendor);

      return { message: 'Vendeur supprimé avec succès.' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la suppression du vendeur ${id}`, error);
      throw new InternalServerErrorException('Impossible de supprimer ce vendeur.');
    }
  }

  /** Restaure un vendeur supprimé (soft-delete). Réservé au SUPER_ADMIN. */
  async restore(id: string): Promise<Vendor> {
    try {
      await this.repo.restore(id);

      const vendor = await this.repo.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!vendor) {
        throw new NotFoundException('Vendeur introuvable.');
      }

      return vendor;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Erreur lors de la restauration du vendeur ${id}`, error);
      throw new InternalServerErrorException('Impossible de restaurer ce vendeur.');
    }
  }
}
