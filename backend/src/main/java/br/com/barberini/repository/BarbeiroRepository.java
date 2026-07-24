package br.com.barberini.repository;

import br.com.barberini.model.Barbeiro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BarbeiroRepository extends JpaRepository<Barbeiro, Long> {
    List<Barbeiro> findByAtivoTrueOrderByNomeAsc();
    List<Barbeiro> findAllByOrderByNomeAsc();
}
