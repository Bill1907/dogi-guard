export type Dog = {
  id: string;
  name: string;
  photo: string;
  birth: Date;
  weight: number;
  currentMedications: string[]; // Current medications
  nextHeartworkMedicationDate: Date; // Next heartworm medication date
  lastHeartworkMedicationDate: Date; // Last heartworm medication date
  heartworkMedicationName: string; // Heartworm medication name
};
