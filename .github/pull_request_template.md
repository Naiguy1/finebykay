## Change and validation

Describe the final behavior and meaningful checks performed.

## Safety review

- [ ] Reviewed docs/feature-safety.md and documented any changed data flows/providers.
- [ ] No secrets, unconsented tracking, unnecessary personal data, or remote font requests.
- [ ] Applicable server authorization, validation, CSRF, ownership, rate limits, deletion,
      payment/email/upload safeguards are implemented and covered by negative tests.
- [ ] Policies reflect actual behavior; unresolved legal/account setup is called out.
- [ ] Keyboard, screen-reader labels/focus, contrast, reflow, and reduced motion reviewed.
- [ ] Required CI checks pass; no security gate was removed to accommodate a new feature.
