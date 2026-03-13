### Use Parameterized Queries
DQL and QueryBuilder shall use parameter bindings. String concatenation in queries is prohibited.

### Service Layer Separation
Business logic shall reside in Service classes. Controllers shall remain thin.

### Use Voter for Authorization
Authorization logic shall be consolidated in Voter classes. Scattering permission checks across controllers is prohibited.

### Use DTO for External Input
External input shall be received via DTO combined with Validator. Direct mapping from Request to Entity is prohibited.
