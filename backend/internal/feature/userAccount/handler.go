package userAccount

import (
	"context"

	"github.com/danielgtaylor/huma/v2"
	"github.com/stringptr/SiGizi/backend/internal/domain/userAccount"
	"github.com/stringptr/SiGizi/backend/internal/infrastructure/jet/imunisasi/public/model"
)

type Handler struct {
	Service userAccount.Service
}

func NewHandler(Service userAccount.Service) *Handler {
	return &Handler{Service: Service}
}

type GetAllResponse struct {
	Body []*model.UserAccount
}

func (h *Handler) GetAll(ctx context.Context, input *struct{}) (*GetAllResponse, error) {
	userAccounts, err := h.Service.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	return &GetAllResponse{Body: userAccounts}, nil
}

type RegisterInput struct {
	Body *userAccount.RegisterRequestDTO
}

func (h *Handler) Register(ctx context.Context, input *RegisterInput) (*struct{}, error) {
	err := h.Service.Register(ctx, input.Body)
	if err != nil {
		return &struct{}{}, huma.Error400BadRequest("Registratin Failed", err)
	}

	return &struct{}{}, nil
}
