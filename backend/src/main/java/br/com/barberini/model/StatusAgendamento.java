package br.com.barberini.model;

public enum StatusAgendamento {
    /** Agendado e ainda não fechado pelo dono */
    CONFIRMADO,
    /** Atendimento aconteceu — conta como faturamento */
    FINALIZADO,
    /** Cliente não apareceu — não conta faturamento */
    NAO_COMPARECEU,
    CANCELADO
}
