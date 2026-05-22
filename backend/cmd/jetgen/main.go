package main

import (
	"backend/internal/config"
	"strconv"

	"github.com/go-jet/jet/v2/generator/postgres"
)

func main() {
	cfg := config.Load()
	dbPortInt, err := strconv.Atoi(cfg.DBMasterConfig.Port)
	if err != nil {
		panic(err)
	}

	err = postgres.Generate("./internal/infrastructure/jet",
		postgres.DBConnection{
			Host:       cfg.DBMasterConfig.Host,
			Port:       dbPortInt,
			User:       cfg.DBMasterConfig.User,
			Password:   cfg.DBMasterConfig.Password,
			DBName:     cfg.DBMasterConfig.DBName,
			SslMode:    "disable",
			SchemaName: "public",
		},
	)
	if err != nil {
		panic(err)
	}
}
