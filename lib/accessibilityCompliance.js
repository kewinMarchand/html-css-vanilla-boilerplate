export const complianceStatus = ({ auditDate, complianceRate }) => {
  if (!auditDate || complianceRate === null || complianceRate < 50) return 'non conforme'
  if (complianceRate < 100) return 'partiellement conforme'
  return 'totalement conforme'
}
