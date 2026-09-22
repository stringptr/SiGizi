package errorutils

import (
	"github.com/stringptr/SiGizi/backend/internal/httputils"
)

type Error struct {
	Status  int
	Message string
	Errors  []*httputils.ErrorItem
}

func (e *Error) Error() string {
	return e.Message
}

func ToHumaError(err *Error) error {
	return &httputils.ValidationError{
		StatusCode: err.Status,
		Detail:     err.Message,
		Errors:     err.Errors,
	}
}
