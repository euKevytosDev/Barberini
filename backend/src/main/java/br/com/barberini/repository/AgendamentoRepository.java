package br.com.barberini.repository;

import br.com.barberini.model.Agendamento;
import br.com.barberini.model.StatusAgendamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {
    List<Agendamento> findByClienteIdAndStatusOrderByDataAscHoraInicioAsc(Long clienteId, StatusAgendamento status);
    List<Agendamento> findByBarbeiroIdAndDataAndStatus(Long barbeiroId, LocalDate data, StatusAgendamento status);
    List<Agendamento> findByDataBetweenAndStatusOrderByDataAscHoraInicioAsc(
            LocalDate inicio, LocalDate fim, StatusAgendamento status);
}
