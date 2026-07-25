package br.com.barberini.repository;

import br.com.barberini.model.BloqueioHorario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BloqueioHorarioRepository extends JpaRepository<BloqueioHorario, Long> {

    @Query("select b from BloqueioHorario b left join fetch b.barbeiro where b.data = :data")
    List<BloqueioHorario> findByData(@Param("data") LocalDate data);

    @Query("select b from BloqueioHorario b left join fetch b.barbeiro where b.data = :data and b.barbeiro.id = :barbeiroId")
    List<BloqueioHorario> findByDataAndBarbeiroId(@Param("data") LocalDate data, @Param("barbeiroId") Long barbeiroId);

    @Query("select b from BloqueioHorario b where b.data = :data and b.barbeiro is null")
    List<BloqueioHorario> findByDataAndBarbeiroIsNull(@Param("data") LocalDate data);

    @Query("select b from BloqueioHorario b left join fetch b.barbeiro where b.data between :inicio and :fim")
    List<BloqueioHorario> findByDataBetween(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);
}
