package br.com.barberini.repository;

import br.com.barberini.model.Servico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServicoRepository extends JpaRepository<Servico, Long> {
    List<Servico> findByAtivoTrueOrderByNomeAsc();
    List<Servico> findAllByOrderByNomeAsc();
}
