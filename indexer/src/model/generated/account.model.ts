import {
  Column as Column_,
  Entity as Entity_,
  OneToMany as OneToMany_,
  PrimaryColumn as PrimaryColumn_,
} from "typeorm";
import { Transfer } from "./transfer.model";

@Entity_()
export class Account {
  constructor(props?: Partial<Account>) {
    Object.assign(this, props);
  }

  /**
   * Account address
   */
  @PrimaryColumn_()
  id!: string;

  @OneToMany_(() => Transfer, (e) => e.to)
  transfersTo!: Transfer[];

  @OneToMany_(() => Transfer, (e) => e.from)
  transfersFrom!: Transfer[];
}
