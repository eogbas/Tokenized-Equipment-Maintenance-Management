;; Asset Registration Contract
;; Records details of industrial equipment as non-fungible tokens

(define-non-fungible-token equipment uint)

;; Data structure for equipment details
(define-map equipment-details uint {
  name: (string-ascii 64),
  manufacturer: (string-ascii 64),
  model: (string-ascii 64),
  serial-number: (string-ascii 64),
  manufacture-date: uint,
  last-maintenance-date: uint,
  owner: principal
})

;; Counter for equipment IDs
(define-data-var equipment-id-counter uint u1)

;; Register new equipment
(define-public (register-equipment
                (name (string-ascii 64))
                (manufacturer (string-ascii 64))
                (model (string-ascii 64))
                (serial-number (string-ascii 64))
                (manufacture-date uint))
  (let ((equipment-id (var-get equipment-id-counter)))
    (try! (nft-mint? equipment equipment-id tx-sender))
    (map-set equipment-details equipment-id {
      name: name,
      manufacturer: manufacturer,
      model: model,
      serial-number: serial-number,
      manufacture-date: manufacture-date,
      last-maintenance-date: u0,
      owner: tx-sender
    })
    (var-set equipment-id-counter (+ equipment-id u1))
    (ok equipment-id)))

;; Transfer equipment ownership
(define-public (transfer-equipment (equipment-id uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender (get owner (default-to {owner: tx-sender} (map-get? equipment-details equipment-id)))) (err u403))
    (try! (nft-transfer? equipment equipment-id tx-sender recipient))
    (let ((details (unwrap! (map-get? equipment-details equipment-id) (err u404))))
      (map-set equipment-details equipment-id (merge details {owner: recipient}))
      (ok true))))

;; Get equipment details
(define-read-only (get-equipment-details (equipment-id uint))
  (map-get? equipment-details equipment-id))

;; Check if equipment exists
(define-read-only (equipment-exists (equipment-id uint))
  (is-some (map-get? equipment-details equipment-id)))

;; Update last maintenance date
(define-public (update-last-maintenance-date (equipment-id uint) (maintenance-date uint))
  (let ((details (unwrap! (map-get? equipment-details equipment-id) (err u404))))
    (asserts! (is-eq tx-sender (get owner details)) (err u403))
    (map-set equipment-details equipment-id (merge details {last-maintenance-date: maintenance-date}))
    (ok true)))
