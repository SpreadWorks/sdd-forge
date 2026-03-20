### Security Impact Disclosure
<!-- {%meta: {phase: [draft, spec]}%} -->
Changes affecting authentication, authorization, or input validation shall explicitly state their security impact in the spec.

### Migration Required for Schema Changes
<!-- {%meta: {phase: [draft, spec]}%} -->
Changes involving database schema modifications shall include a migration plan in the spec.

### Input Sanitization Required
<!-- {%meta: {phase: [spec, impl]}%} -->
Changes handling user input shall specify countermeasures against SQL injection, XSS, path traversal, and similar attacks in the spec.

### No Reinventing Framework Features
<!-- {%meta: {phase: [spec, impl]}%} -->
When the framework provides a built-in feature, custom implementations of the same functionality are prohibited.

### No Sensitive Data in Logs
<!-- {%meta: {phase: [impl]}%} -->
Logs shall not contain passwords, tokens, or personally identifiable information. Sensitive data shall be masked or excluded.
