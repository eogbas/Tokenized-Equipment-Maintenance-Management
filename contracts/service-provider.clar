;; Service Provider Verification Contract
;; Validates qualified maintenance technicians

;; Data structure for service providers
(define-map service-providers principal {
  name: (string-ascii 64),
  certification: (string-ascii 64),
  specialization: (string-ascii 64),
  certification-expiry: uint,
  is-active: bool
})

;; List of authorized certifiers who can verify service providers
(define-map authorized-certifiers principal bool)

;; Initialize contract owner as first authorized certifier
(define-data-var contract-owner principal tx-sender)

;; Check if caller is contract owner
(define-private (is-contract-owner)
  (is-eq tx-sender (var-get contract-owner)))

;; Add an authorized certifier
(define-public (add-authorized-certifier (certifier principal))
  (begin
    (asserts! (is-contract-owner) (err u403))
    (map-set authorized-certifiers certifier true)
    (ok true)))

;; Remove an authorized certifier
(define-public (remove-authorized-certifier (certifier principal))
  (begin
    (asserts! (is-contract-owner) (err u403))
    (map-delete authorized-certifiers certifier)
    (ok true)))

;; Register a service provider
(define-public (register-service-provider
                (provider principal)
                (name (string-ascii 64))
                (certification (string-ascii 64))
                (specialization (string-ascii 64))
                (certification-expiry uint))
  (begin
    (asserts! (or (is-contract-owner) (default-to false (map-get? authorized-certifiers tx-sender))) (err u403))
    (map-set service-providers provider {
      name: name,
      certification: certification,
      specialization: specialization,
      certification-expiry: certification-expiry,
      is-active: true
    })
    (ok true)))

;; Update service provider status
(define-public (update-provider-status (provider principal) (is-active bool))
  (begin
    (asserts! (or (is-contract-owner) (default-to false (map-get? authorized-certifiers tx-sender))) (err u403))
    (let ((details (unwrap! (map-get? service-providers provider) (err u404))))
      (map-set service-providers provider (merge details {is-active: is-active}))
      (ok true))))

;; Get service provider details
(define-read-only (get-service-provider (provider principal))
  (map-get? service-providers provider))

;; Check if service provider is verified and active
(define-read-only (is-verified-provider (provider principal))
  (let ((provider-details (map-get? service-providers provider)))
    (and
      (is-some provider-details)
      (get is-active (default-to {is-active: false} provider-details))
      (> (get certification-expiry (default-to {certification-expiry: u0} provider-details)) block-height)
    )))
