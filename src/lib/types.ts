export type SpaceStatus = "available" | "occupied" | "construction";
export type PaymentStatus = "pending" | "verified" | "rejected";
export type PaymentType = "rent" | "electricity";
export type ExpenseCategory = "construction" | "operating";
export type FinancingMode = "cash" | "financed";

export type Space = {
  id: string;
  name: string;
  description: string;
  price: number;
  status: SpaceStatus;
  image_urls: string[];
  business_name?: string | null;
  business_description?: string | null;
  business_image_urls?: string[];
  sort_order: number;
};

export type Tenant = {
  id: string;
  name: string;
  contact_info: string;
};

export type ContractAttachment = {
  path: string;
  url: string;
  name: string;
  isPdf: boolean;
};

export type Lease = {
  id: string;
  space_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  active: boolean;
  contract_files?: string[];
  attachments?: ContractAttachment[];
};

export type Payment = {
  id: string;
  lease_id: string;
  payment_type: PaymentType;
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

export type AdminLease = Lease & {
  space: Pick<Space, "id" | "name" | "status" | "price">;
  tenant: Tenant;
  payment_count?: number;
};

export type AdminTenant = Tenant & {
  email: string | null;
};

export type FormState = {
  ok: boolean;
  message: string;
};

export type ModuleExpense = {
  id: string;
  space_id: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  reason: string;
  receipt_path: string | null;
  created_at: string;
  signed_receipt_url?: string;
};

export type ModuleFinancing = {
  space_id: string;
  financing_mode: FinancingMode;
  loan_amount: number;
  annual_interest_rate: number;
  term_months: number;
  down_payment: number | null;
  monthly_operating_expense: number;
  vacancy_rate_pct: number;
  updated_at: string;
};

export type YearlyCollectedRent = {
  year: number;
  amount: number;
  paymentCount: number;
};

export type ModuleProfitabilityMetrics = {
  spaceId: string;
  spaceName: string;
  spaceStatus: SpaceStatus;
  sortOrder: number;
  monthlyRent: number;
  isProjectedRent: boolean;
  grossAnnualRent: number;
  effectiveAnnualRent: number;
  effective_annual_rent: number;
  vacancyRatePct: number;
  vacancy_rate_pct: number;
  monthlyOperatingExpense: number;
  monthly_operating_expense: number;
  totalConstructionCost: number;
  totalOperatingExpenses: number;
  totalSpent: number;
  annualOperatingExpenses: number;
  annual_operating_expense: number;
  loggedAnnualOperatingExpenses: number;
  usesBudgetedOperatingExpense: boolean;
  totalCollectedRent: number;
  collectedByYear: YearlyCollectedRent[];
  netBalance: number;
  paybackPercent: number | null;
  paybackMonthsRemaining: number | null;
  occupancyRate: number | null;
  occupiedMonths: number;
  trackedMonths: number;
  financingMode: FinancingMode;
  financing: ModuleFinancing | null;
  monthlyDebtService: number;
  annualDebtService: number;
  cashInvested: number;
  noi: number;
  grm: number | null;
  onePercentRulePct: number | null;
  meetsOnePercentRule: boolean | null;
  capRatePct: number | null;
  annualCashFlow: number;
  monthlyCashFlow: number;
  cashOnCashPct: number | null;
  expenses: ModuleExpense[];
};

export type PlazaProfitabilitySummary = {
  totalInvested: number;
  totalConstructionCost: number;
  totalOperatingExpenses: number;
  totalCollectedRent: number;
  overallNetBalance: number;
  overallPaybackPercent: number | null;
  blendedCapRatePct: number | null;
  totalMonthlyRent: number;
  totalGrossAnnualRent: number;
  totalEffectiveAnnualRent: number;
  effective_annual_rent: number;
  totalAnnualOperatingExpenses: number;
  annual_operating_expense: number;
  totalAnnualNoi: number;
  totalAnnualCashFlow: number;
  topPerformingModule: {
    spaceId: string;
    spaceName: string;
    capRatePct: number | null;
    netBalance: number;
  } | null;
};
