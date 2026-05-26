package userAccount

import (
	"context"

	"github.com/jinzhu/copier"
	"github.com/stringptr/SiGizi/backend/internal/domain/userAccount"
	"github.com/stringptr/SiGizi/backend/internal/infrastructure/jet/imunisasi/public/model"
)

type Service struct {
	Repository userAccount.Repo
}

func NewService(Repository userAccount.Repo) *Service {
	return &Service{Repository: Repository}
}

func (s *Service) GetAll(ctx context.Context) ([]*model.UserAccount, error) {
	userAccounts, err := s.Repository.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	return userAccounts, nil
}

func (s *Service) Register(ctx context.Context, dataDTO *userAccount.RegisterRequestDTO) error {
	dataModel := model.UserAccount{}
	copier.Copy(&dataDTO, &dataModel)

	err := s.Repository.Create(ctx, &dataModel)
	if err != nil {
		return err
	}
	return nil
}
