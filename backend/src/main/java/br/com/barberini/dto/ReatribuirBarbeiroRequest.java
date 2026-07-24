package br.com.barberini.dto;

import jakarta.validation.constraints.NotNull;

public record ReatribuirBarbeiroRequest(
        @NotNull Long barbeiroId
) {}
