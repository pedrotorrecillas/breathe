# Job Extraction Schema

This schema is the normalized output contract for recruiter job extraction in the MVP.

## Root object

`JobExtractionDraft`

- `jobConditions`: `JobConditionInput[]`
- `essentialRequirements`: `JobRequirementInput[]`
- `technicalSkills`: `JobRequirementInput[]`
- `interpersonalSkills`: `JobRequirementInput[]`

Each scored section can be empty when the source job description does not provide enough valid content.

## Job conditions

`JobConditionInput`

- `id`: stable local identifier
- `code`: one of `salary`, `location`, `schedule`, `right_to_work`, `driving_license`, `remote_policy`, `contract_type`, `visa_status`, `other`
- `label`: recruiter-facing label
- `value`: extracted or manually completed value
- `state`: `complete`, `incomplete`, or `missing`
- `details`: extra recruiter-facing context about ambiguity or missing data

Rules:

- job conditions are separate from scored sections
- conditions can stay `missing` or `incomplete` without breaking the schema
- `value` must be present when state is `complete` or `incomplete`

## Scored sections

`JobRequirementInput`

- `id`: stable local identifier
- `label`: recruiter-editable requirement text
- `importance`: `MANDATORY` or `OPTIONAL`

Rules:

- essential, technical, and interpersonal requirements are kept in separate arrays
- importance is explicit on every item
- empty arrays are valid

## Usage

- extraction logic must emit this schema
- recruiter editing UI must preserve this normalized shape
- publish flow should persist this shape as the source of truth for job configuration
