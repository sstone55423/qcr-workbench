// Registry of the bundled sample-scenario libraries. Each library is a
// fictional organization in a different sector; scenario ids are unique
// ACROSS libraries (prefixed) because localizeSample() and the portfolio's
// seed derivation key off the id. `company` is the proper noun stored in
// audit params (language-neutral); `labelKey` is the translated picker label.
import stellaPolaris from '@/data/stellaPolaris.json';
import higherEd from '@/data/higherEd.json';
import healthcare from '@/data/healthcare.json';
import financialServices from '@/data/financialServices.json';
import cityGovernment from '@/data/cityGovernment.json';
import schoolDistrict from '@/data/schoolDistrict.json';
import cattleRanch from '@/data/cattleRanch.json';
import groceryChain from '@/data/groceryChain.json';
import ecommerce from '@/data/ecommerce.json';
import transportation from '@/data/transportation.json';
import publicSafety from '@/data/publicSafety.json';
import staffing from '@/data/staffing.json';
import telecom from '@/data/telecom.json';
import mssp from '@/data/mssp.json';
import energyCoop from '@/data/energyCoop.json';
import legal from '@/data/legal.json';
import realEstate from '@/data/realEstate.json';
import courts from '@/data/courts.json';
import elections from '@/data/elections.json';
import emergencyServices from '@/data/emergencyServices.json';
import media from '@/data/media.json';

export const SAMPLE_LIBRARIES = [
  { id: 'stella-polaris', labelKey: 'samplesLib.stellaPolaris', company: 'Stella Polaris Medical Components', scenarios: stellaPolaris },
  { id: 'higher-ed', labelKey: 'samplesLib.higherEd', company: 'Northfield State University', scenarios: higherEd },
  { id: 'healthcare', labelKey: 'samplesLib.healthcare', company: 'Riverbend Regional Health', scenarios: healthcare },
  { id: 'financial-services', labelKey: 'samplesLib.financialServices', company: 'Prairie Trust Financial', scenarios: financialServices },
  { id: 'city-government', labelKey: 'samplesLib.cityGovernment', company: 'City of Larkspur Bend', scenarios: cityGovernment },
  { id: 'school-district', labelKey: 'samplesLib.schoolDistrict', company: 'Bluffview Independent School District', scenarios: schoolDistrict },
  { id: 'cattle-ranch', labelKey: 'samplesLib.cattleRanch', company: 'Double Mesa Cattle Company', scenarios: cattleRanch },
  { id: 'grocery-chain', labelKey: 'samplesLib.groceryChain', company: "Hartley's Market Group", scenarios: groceryChain },
  { id: 'ecommerce', labelKey: 'samplesLib.ecommerce', company: 'Lakeshore Outfitters', scenarios: ecommerce },
  { id: 'transportation', labelKey: 'samplesLib.transportation', company: 'Iron Range Freightways', scenarios: transportation },
  { id: 'public-safety', labelKey: 'samplesLib.publicSafety', company: "Cedar County Sheriff's Office", scenarios: publicSafety },
  { id: 'staffing', labelKey: 'samplesLib.staffing', company: 'Brightpath Staffing Group', scenarios: staffing },
  { id: 'telecom', labelKey: 'samplesLib.telecom', company: 'North Prairie Telecom', scenarios: telecom },
  { id: 'mssp', labelKey: 'samplesLib.mssp', company: 'Sentinel Ridge Security', scenarios: mssp },
  { id: 'energy-coop', labelKey: 'samplesLib.energyCoop', company: 'Tamarack Valley Electric Cooperative', scenarios: energyCoop },
  { id: 'legal', labelKey: 'samplesLib.legal', company: 'Harrington & Vance LLP', scenarios: legal },
  { id: 'real-estate', labelKey: 'samplesLib.realEstate', company: 'Blue Spruce Property Group', scenarios: realEstate },
  { id: 'courts', labelKey: 'samplesLib.courts', company: 'Pine River Judicial District', scenarios: courts },
  { id: 'elections', labelKey: 'samplesLib.elections', company: 'Aspen County Elections Office', scenarios: elections },
  { id: 'emergency-services', labelKey: 'samplesLib.emergencyServices', company: 'Tri-River Regional Dispatch', scenarios: emergencyServices },
  { id: 'media', labelKey: 'samplesLib.media', company: 'Northern Lights Media Group', scenarios: media },
];

export const DEFAULT_LIBRARY_ID = 'stella-polaris';

export function getLibrary(libraryId) {
  return SAMPLE_LIBRARIES.find((library) => library.id === libraryId) || SAMPLE_LIBRARIES[0];
}

// Looks a sample up across ALL libraries (scenario.sample_id → definition),
// used by the Assumptions step's "reset to sample values".
export function findSampleById(sampleId) {
  for (const library of SAMPLE_LIBRARIES) {
    const sample = library.scenarios.find((s) => s.id === sampleId);
    if (sample) return sample;
  }
  return null;
}
