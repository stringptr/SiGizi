package graphql

import (
	artikelDomain "github.com/stringptr/SiGizi/backend/internal/domain/artikel"
)

// Resolver is the root resolver holding all dependencies.
type Resolver struct {
	ArtikelService artikelDomain.Service
	ArtikelRepo    artikelDomain.Repo
}
