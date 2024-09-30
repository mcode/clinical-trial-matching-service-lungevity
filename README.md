# clinical-trial-matching-service-lungevity

Clinical trial matching service wrapper for [LUNGevity](https://www.lungevity.org/).

For more information on the architecture and data schemas of the clinical trial matching system, please visit the [clinical-trial-matching-app wiki](https://github.com/mcode/clinical-trial-matching-app/wiki).

# Running the Server

1. Run `npm install`
2. Run `npm start`
3. The service will now be running at http://localhost:3003/

# Testing

A validation test is provided to validate the ResearchStudy created via this service. Put an example response object in `spec/data/trial_object.json` and this object will be loaded and validated by the test in `spec/validate.spec.ts`.

For this test to produce meaningful results, you must have:

1. Placed appropriate test data in `spec/data/trial_object.json` (the default is an empty object)
2. Properly implemented `convertToResearchStudy` in `src/researchstudy-mapping.ts`

The test will always output any messages from the FHIR validator, even if the result is valid, so you may see warning messages displayed in the test output.
