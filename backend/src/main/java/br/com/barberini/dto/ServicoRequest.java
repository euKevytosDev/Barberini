package br.com.barberini.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ServicoRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotNull @DecimalMin("0.0") BigDecimal preco,
        @NotNull @Min(5) Integer duracaoMin,
        Boolean ativo
) {}
