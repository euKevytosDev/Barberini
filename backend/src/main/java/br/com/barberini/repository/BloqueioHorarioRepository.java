package br.com.barberini.repository;

import br.com.barberini.model.BloqueioHorario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface BloqueioHorarioRepository extends JpaRepository<BloqueioHorario, Long> {
    List<BloqueioHorario> findByData(LocalDate data);
    List<BloqueioHorario> findByDataAndBarbeiroId(LocalDate data, Long barbeiroId);
    List<BloqueioHorario> findByDataAndBarbeiroIsNull(LocalDate data);
}
