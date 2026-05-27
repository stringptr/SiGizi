package v1

import (
	"github.com/stringptr/SiGizi/backend/internal/config"
	"github.com/stringptr/SiGizi/backend/internal/userAccount"

	"github.com/danielgtaylor/huma/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RegisterRoutes(api huma.API, db *pgxpool.Pool, cfg *config.Config) {
	userRepo := userAccount.NewRepo(db)
	userService := userAccount.NewService(userRepo)
	userHandler := userAccount.NewHandler(userService)

	huma.Get(api, "/superadmin/users", userHandler.GetAll)
	huma.Post(api, "/register", userHandler.Register)
}
