export interface Configuration {
  algorithms: number[]
  timeout: number
  verification?: UserVerificationRequirement
  residence?: ResidentKeyRequirement
}
