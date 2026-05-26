package hash

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

type Params struct {
	Memory      uint32
	Iterations  uint32
	Parallelism uint8
	SaltLength  uint32
	KeyLength   uint32
}

var DefaultParams = &Params{
	Memory:      64 * 1024,
	Iterations:  3,
	Parallelism: 2,
	SaltLength:  16,
	KeyLength:   32,
}

func Hash(text string) (string, error) {
	salt, err := generateRandomBytes(DefaultParams.SaltLength)
	if err != nil {
		return "", err
	}
	key := argon2.IDKey(
		[]byte(text),
		salt,
		DefaultParams.Iterations,
		DefaultParams.Memory,
		DefaultParams.Parallelism,
		DefaultParams.KeyLength,
	)
	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Key := base64.RawStdEncoding.EncodeToString(key)
	return fmt.Sprintf("%s$%s", b64Salt, b64Key), nil
}

func VerifyHash(text, encoded string) (bool, error) {
	parts := strings.SplitN(encoded, "$", 2)
	if len(parts) != 2 {
		return false, fmt.Errorf("invalid hash format")
	}

	b64Salt, b64Key := parts[0], parts[1]
	salt, err := base64.RawStdEncoding.DecodeString(b64Salt)
	if err != nil {
		return false, fmt.Errorf("invalid salt encoding: %w", err)
	}
	expectedKey, err := base64.RawStdEncoding.DecodeString(b64Key)
	if err != nil {
		return false, fmt.Errorf("invalid key encoding: %w", err)
	}

	computedKey := argon2.IDKey(
		[]byte(text),
		salt,
		DefaultParams.Iterations,
		DefaultParams.Memory,
		DefaultParams.Parallelism,
		uint32(len(expectedKey)),
	)

	if subtle.ConstantTimeCompare(expectedKey, computedKey) == 1 {
		return true, nil
	}
	return false, nil
}

func generateRandomBytes(n uint32) ([]byte, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)
	if err != nil {
		return nil, err
	}

	return b, nil
}
