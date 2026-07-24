package br.com.barberini.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record CriarAgendamentoRequest(
        @NotNull Long barbeiroId,
        @NotNull Long servicoId,
        @NotNull LocalDate data,
        @NotNull LocalTime horaInicio,
        @Size(max = 200) String observacao
) {}
