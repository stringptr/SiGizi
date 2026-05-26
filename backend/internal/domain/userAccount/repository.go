package userAccount

import (
	"context"

	"github.com/stringptr/SiGizi/backend/internal/infrastructure/jet/imunisasi/public/model"
)

type Repo interface {
	GetAll(ctx context.Context) ([]*model.UserAccount, error)
	Create(ctx context.Context, dataModel *model.UserAccount) error
	UpdateStatusVerifikasiByID(ctx context.Context, IDUser int32, statusVerifikasi bool) error
	DeleteByID(ctx context.Context, IDUser int32) error
}
