// Registry of the bundled sample-scenario libraries. Each library is a
// fictional organization in a different sector; scenario ids are unique
// ACROSS libraries (prefixed) because localizeSample() and the portfolio's
// seed derivation key off the id. `company` is the proper noun stored in
// audit params (language-neutral); `labelKey` is the translated picker label.
import stellaPolaris from '@/data/stellaPolaris.json';
import higherEd from '@/data/higherEd.json';
import healthcare from '@/data/healthcare.json';

export const SAMPLE_LIBRARIES = [
  { id: 'stella-polaris', labelKey: 'samplesLib.stellaPolaris', company: 'Stella Polaris Medical Components', scenarios: stellaPolaris },
  { id: 'higher-ed', labelKey: 'samplesLib.higherEd', company: 'Northfield State University', scenarios: higherEd },
  { id: 'healthcare', labelKey: 'samplesLib.healthcare', company: 'Riverbend Regional Health', scenarios: healthcare },
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
