package graphql

func ptrToInt(p *int) int {
	if p == nil {
		return 0
	}
	return *p
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func safePtrStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
