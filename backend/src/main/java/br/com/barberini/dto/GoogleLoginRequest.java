package br.com.barberini.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequest(
        @NotBlank String credential
) {
}
