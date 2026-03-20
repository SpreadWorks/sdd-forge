<!-- {%guardrail {phase: [spec, impl]}%} -->
### Use Parameterized Queries
DQL and QueryBuilder shall use parameter bindings. String concatenation in queries is prohibited.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [spec, impl]}%} -->
### Service Layer Separation
Business logic shall reside in Service classes. Controllers shall remain thin.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [spec, impl]}%} -->
### Use Voter for Authorization
Authorization logic shall be consolidated in Voter classes. Scattering permission checks across controllers is prohibited.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [impl]}%} -->
### Use DTO for External Input
External input shall be received via DTO combined with Validator. Direct mapping from Request to Entity is prohibited.
<!-- {%/guardrail%} -->
