package httputils

import (
	"net/http"
	"strconv"

	"github.com/danielgtaylor/huma/v2"
)

type APIResponse[T any] struct {
	Status  int         `json:"status"`
	Success bool        `json:"success"`
	Data    T           `json:"data,omitempty"`
	Errors  []ErrorItem `json:"errors,omitempty"`
	Detail  string      `json:"detail,omitempty"`
	Title   string      `json:"title,omitempty"`
}

func (APIResponse[T]) isUnified() {}

type unifiedMarker interface {
	isUnified()
}

type ErrorItem struct {
	Location string `json:"location,omitempty"`
	Message  string `json:"message"`
	Value    any    `json:"value,omitempty"`
}

func OK[T any](data T) APIResponse[T] {
	return APIResponse[T]{Status: http.StatusOK, Success: true, Data: data, Detail: "OK", Title: "Success"}
}

func Created[T any](data T) APIResponse[T] {
	return APIResponse[T]{Status: http.StatusCreated, Success: true, Data: data, Detail: "Created", Title: "Created"}
}

func Success[T any](status int, data T, detail string, title string) APIResponse[T] {
	return APIResponse[T]{Status: status, Success: true, Data: data, Detail: detail, Title: title}
}

func Error[T any](status int, title, detail string, errors []ErrorItem) APIResponse[T] {
	var zero T
	return APIResponse[T]{Status: status, Success: false, Data: zero, Detail: detail, Title: title, Errors: errors}
}

func UnifiedTransformer(ctx huma.Context, status string, v any) (any, error) {
	if _, ok := v.(unifiedMarker); ok {
		return v, nil
	}

	if errModel, ok := v.(*huma.ErrorModel); ok {
		return convertErrorModel(errModel), nil
	}
	if errModel, ok := v.(huma.ErrorModel); ok {
		return convertErrorModel(&errModel), nil
	}

	statusCode, _ := strconv.Atoi(status)
	return APIResponse[any]{
		Status:  statusCode,
		Success: statusCode < 400,
		Data:    v,
		Title:   http.StatusText(statusCode),
	}, nil
}

func convertErrorModel(m *huma.ErrorModel) APIResponse[any] {
	var errors []ErrorItem
	if len(m.Errors) > 0 {
		errors = make([]ErrorItem, len(m.Errors))
		for i, e := range m.Errors {
			if e != nil {
				errors[i] = ErrorItem{
					Location: e.Location,
					Message:  e.Message,
					Value:    e.Value,
				}
			}
		}
	}
	return APIResponse[any]{
		Status:  m.Status,
		Success: false,
		Detail:  m.Detail,
		Title:   m.Title,
		Errors:  errors,
	}
}
