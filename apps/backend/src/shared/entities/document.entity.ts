import { Entity, PrimaryGeneratedColumn, Column} from 'typeorm';

@Entity()
export class Document {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ name: 'page', type: 'int' })
  page!:number;

  @Column('text')
  content!: string;

  @Column("vector", { nullable: true })
  embedding!: number[];
}
