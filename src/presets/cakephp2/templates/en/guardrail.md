<!-- {%guardrail {phase: [spec, impl]}%} -->
### No Raw SQL Without Sanitization
When using `query()` or `$db->rawQuery()`, placeholders shall be used. Building SQL via string concatenation is prohibited.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [spec, impl]}%} -->
### Fat Model, Skinny Controller
Business logic shall reside in Models. Controllers shall not contain business logic.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [impl]}%} -->
### Validate Before Save
Models shall define validation rules via `beforeSave` or `$validate`. Calling `save()` without validation is prohibited.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [impl]}%} -->
### No Direct Session Manipulation
Direct access to `$_SESSION` is prohibited. Use `CakeSession` instead.
<!-- {%/guardrail%} -->
