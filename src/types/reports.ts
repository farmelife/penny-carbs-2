export interface SalesReportData {
  panchayat_id: string;
  panchayat_name: string;
  ward_number: number | null;
  total_orders: number;
  total_sales: number;
  delivered_orders: number;
  cancelled_orders: number;
  pending_orders: number;
}

export interface CookPerformanceData {
  cook_id: string;
  kitchen_name: string;
  total_orders: number;
  accepted_orders: number;
  rejected_orders: number;
  completed_orders: number;
  average_rating: number;
  total_earnings: number;
}

export interface DeliverySettlementData {
  staff_id: string;
  staff_name: string;
  total_deliveries: number;
  collected_amount: number;
  job_earnings: number;
  total_settled: number;
  pending_settlement: number;
}

export interface ReferralReportData {
  referrer_id: string;
  referrer_name: string;
  referral_code: string;
  total_referrals: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
}

export interface ReportFilters {
  startDate: Date | undefined;
  endDate: Date | undefined;
  serviceType: string;
  panchayatId: string;
}
