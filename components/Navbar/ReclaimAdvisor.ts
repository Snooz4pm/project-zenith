export function reclaimAdvisor(
  numAccounts: number,
  feeEstimate: number
): "Reclaim now" | "Wait for lower fees" {
  // Assume each reclaim refunds ~0.002 SOL, fee ~0.000005 SOL per account
  const benefit = numAccounts * 0.002;
  const totalFee = feeEstimate * numAccounts;
  return benefit > totalFee * 2 ? "Reclaim now" : "Wait for lower fees";
}
