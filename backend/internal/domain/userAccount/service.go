package userAccount

import (
	"context"

	"github.com/stringptr/SiGizi/backend/internal/infrastructure/jet/imunisasi/public/model"
)

type Service interface {
	GetAll(ctx context.Context) ([]*model.UserAccount, error)
	Register(ctx context.Context, dataDTO *RegisterRequestDTO) error
}
