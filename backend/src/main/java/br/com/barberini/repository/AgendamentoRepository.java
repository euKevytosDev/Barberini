package br.com.barberini.repository;

import br.com.barberini.model.Agendamento;
import br.com.barberini.model.StatusAgendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    @Query("""
            select a from Agendamento a
            join fetch a.cliente
            join fetch a.barbeiro
            join fetch a.servico
            where a.cliente.id = :clienteId and a.status = :status
            order by a.data asc, a.horaInicio asc
            """)
    List<Agendamento> findByClienteIdAndStatusOrderByDataAscHoraInicioAsc(
            @Param("clienteId") Long clienteId,
            @Param("status") StatusAgendamento status);

    @Query("""
            select a from Agendamento a
            join fetch a.cliente
            join fetch a.barbeiro
            join fetch a.servico
            where a.barbeiro.id = :barbeiroId and a.data = :data and a.status = :status
            """)
    List<Agendamento> findByBarbeiroIdAndDataAndStatus(
            @Param("barbeiroId") Long barbeiroId,
            @Param("data") LocalDate data,
            @Param("status") StatusAgendamento status);

    @Query("""
            select a from Agendamento a
            join fetch a.cliente
            join fetch a.barbeiro
            join fetch a.servico
            where a.data between :inicio and :fim and a.status = :status
            order by a.data asc, a.horaInicio asc
            """)
    List<Agendamento> findByDataBetweenAndStatusOrderByDataAscHoraInicioAsc(
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim,
            @Param("status") StatusAgendamento status);

    @Query("""
            select a from Agendamento a
            join fetch a.cliente
            join fetch a.barbeiro
            join fetch a.servico
            where a.id = :id
            """)
    Optional<Agendamento> findByIdComDetalhes(@Param("id") Long id);
}
