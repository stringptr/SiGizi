package timestamp

import "time"

type TimestampEntity struct {
	CreatedAt time.Time `json:"created_at" db:"created_at" validate:"required"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at" validate:"required"`
}

type SessionTimestampEntity struct {
	TimestampEntity
	ExpiredAt time.Time `json:"expired_at" db:"expired_at" validate:"required"`
}
