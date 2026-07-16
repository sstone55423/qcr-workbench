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

export const SAMPLE_LIBRARIES = [
  { id: 'stella-polaris', labelKey: 'samplesLib.stellaPolaris', company: 'Stella Polaris Medical Components', scenarios: stellaPolaris },
  { id: 'higher-ed', labelKey: 'samplesLib.higherEd', company: 'Northfield State University', scenarios: higherEd },
  { id: 'healthcare', labelKey: 'samplesLib.healthcare', company: 'Riverbend Regional Health', scenarios: healthcare },
  { id: 'financial-services', labelKey: 'samplesLib.financialServices', company: 'Prairie Trust Financial', scenarios: financialServices },
  { id: 'city-government', labelKey: 'samplesLib.cityGovernment', company: 'City of Larkspur Bend', scenarios: cityGovernment },
  { id: 'school-district', labelKey: 'samplesLib.schoolDistrict', company: 'Bluffview Independent School District', scenarios: schoolDistrict },
  { id: 'cattle-ranch', labelKey: 'samplesLib.cattleRanch', company: 'Double Mesa Cattle Company', scenarios: cattleRanch },
  { id: 'grocery-chain', labelKey: 'samplesLib.groceryChain', company: "Hartley's Market Group", scenarios: groceryChain },
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
