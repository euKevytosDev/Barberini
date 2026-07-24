package br.com.barberini.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record BloqueioRequest(
        Long barbeiroId,
        @NotNull LocalDate data,
        @NotNull LocalTime hora,
        @Size(max = 160) String motivo
) {}
