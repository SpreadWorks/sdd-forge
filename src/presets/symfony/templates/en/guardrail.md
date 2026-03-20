### Use Parameterized Queries
<!-- {%meta: {phase: [spec, impl]}%} -->
DQL and QueryBuilder shall use parameter bindings. String concatenation in queries is prohibited.

### Service Layer Separation
<!-- {%meta: {phase: [spec, impl]}%} -->
Business logic shall reside in Service classes. Controllers shall remain thin.

### Use Voter for Authorization
<!-- {%meta: {phase: [spec, impl]}%} -->
Authorization logic shall be consolidated in Voter classes. Scattering permission checks across controllers is prohibited.

### Use DTO for External Input
<!-- {%meta: {phase: [impl]}%} -->
External input shall be received via DTO combined with Validator. Direct mapping from Request to Entity is prohibited.
