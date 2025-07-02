export interface SelfVerificationResult {
  // Check if the whole verification has succeeded
  isValid: boolean;
  isValidDetails: {
    // Verifies that the proof is generated under the expected scope.
    isValidScope: boolean;
    //Check that the proof's attestation identifier matches the expected value.
    isValidAttestationId: boolean;
    // Verifies the cryptographic validity of the proof.
    isValidProof: boolean;
    // Ensures that the revealed nationality is correct (when nationality verification is enabled).
    isValidNationality: boolean;
  };
  // User Identifier which is included in the proof
  userId: string;
  // Application name, which is the same as scope
  application: string;
  // A cryptographic value used to prevent double registration or reuse of the same proof.
  nullifier: string;
  // Revealed data by users
  credentialSubject: {
    // Merkle root, which is used to generate proof.
    merkle_root?: string;
    // Proved identity type. For passport, this value is fixed as 1.
    attestation_id?: string;
    // Date when the proof is generated
    current_date?: string;
    // Revealed issuing state in the passport
    issuing_state?: string;
    // Revealed name in the passport
    name?: string;
    // Revealed passport number in the passport
    passport_number?: string;
    // Revealed nationality in the passport
    nationality?: string;
    // Revealed date of birth in the passport
    date_of_birth?: string;
    // Revealed gender in the passport
    gender?: string;
    // Revealed expiry date in the passport
    expiry_date?: string;
    // Result of older than
    older_than?: string;
    // Result of passport number ofac check
    // Gives true if the user passed the check (is not on the list),
    // false if the check was not requested or if the user is in the list
    passport_no_ofac?: boolean;
    // Result of name and date of birth ofac check
    name_and_dob_ofac?: boolean;
    // Result of name and year of birth ofac check
    name_and_yob_ofac?: boolean;
  };
  proof: {
    // Proof that is used for this verification
    value: {
      proof: unknown;
      publicSignals: unknown;
    };
  };
}
