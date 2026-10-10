export type SpaceStatus = "available" | "occupied" | "construction";
export type PaymentStatus = "pending" | "verified" | "rejected";

export type Space = {
  id: string;
  name: string;
  description: string;
  price: number;
  status: SpaceStatus;
  image_urls: string[];
  sort_order: number;
};

export type Tenant = {
  id: string;
  name: string;
  contact_info: string;
};

export type Lease = {
  id: string;
  space_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  active: boolean;
};

export type Payment = {
  id: string;
  lease_id: string;
  amount: number;
  payment_date: string;
  period_month: number;
  period_year: number;
  receipt_path: string;
  status: PaymentStatus;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type LeaseWithRelations = Lease & {
  space: Pick<Space, "id" | "name">;
  tenant: Tenant;
};

export type FormState = {
  ok: boolean;
  message: string;
};
